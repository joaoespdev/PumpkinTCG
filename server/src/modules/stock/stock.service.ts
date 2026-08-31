import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Condition, Finish, MovementType } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEntryDto, EntryItemDto } from "./dto/create-entry.dto";
import { CreateRemovalDto } from "./dto/create-removal.dto";
import { ListStockQuery } from "./dto/list-stock.query";
import { ScryfallProductData, ScryfallService } from "./scryfall.service";
import { StockRepository } from "./stock.repository";

// ============================================================================
// Service: a regra de negócio. Não sabe o que é HTTP.
//
// A regra que organiza tudo: QUANTIDADE NUNCA MUDA POR EDIÇÃO DIRETA.
// Só muda criando um movimento. Saldo é consequência do extrato,
// como no banco: você não edita seu saldo — você deposita ou saca.
// ============================================================================

interface ResolvedEntryItem {
  item: EntryItemDto;
  productData: ScryfallProductData | null; // null => item.productId (manual)
}

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: StockRepository,
    private readonly scryfall: ScryfallService,
    private readonly config: ConfigService,
  ) {}

  // Provisório até o auth (Parte 4): vendedor e autor são o usuário da
  // loja criado pelo seed. Quando o AuthGuard entrar, o actorId passa a
  // vir do JWT — e este getter some.
  private get storeUserId(): string {
    const id = this.config.get<string>("STORE_USER_ID");
    if (!id) {
      throw new Error("STORE_USER_ID não definido — confira o server/.env");
    }
    return id;
  }

  // Entrada em lote -----------------------------------------------------------

  async createEntries(dto: CreateEntryDto) {
    // FASE 1 — sem transação: resolve os dados externos primeiro.
    // Rede é lenta; transação aberta esperando o Scryfall responder é
    // receita pra timeout (o $transaction interativo expira em ~5s).
    const resolved: ResolvedEntryItem[] = [];
    for (const item of dto.items) {
      const hasProductId = Boolean(item.productId);
      const hasExternalId = Boolean(item.externalId);
      if (hasProductId === hasExternalId) {
        throw new BadRequestException(
          "Cada item deve ter apenas productId OU externalId — exatamente um dos dois",
        );
      }

      if (item.externalId) {
        const card = await this.scryfall.getCardForProduct(item.externalId);
        const finish = item.finish ?? Finish.NONFOIL;
        if (!card.finishes.includes(finish)) {
          throw new BadRequestException(
            `"${card.name}" não existe em ${finish}. ` +
              `Acabamentos disponíveis: ${card.finishes.join(", ")}`,
          );
        }
        resolved.push({ item, productData: card });
      } else {
        resolved.push({ item, productData: null });
      }
    }

    const userId = this.storeUserId;

    // FASE 2 — transação: ou o lote INTEIRO entra, ou nada entra.
    // Se o item 37 falhar, os 36 anteriores voltam atrás — nunca fica
    // meio lote cadastrado sem saber quais entraram.
    return this.prisma.$transaction(async (tx) => {
      const entries = [];

      for (const { item, productData } of resolved) {
        let productId: string;
        if (productData) {
          const product = await this.repo.upsertScryfallProduct(
            tx,
            productData,
          );
          productId = product.id;
        } else {
          const product = await this.repo.findProductById(
            tx,
            item.productId as string,
          );
          if (!product || product.deletedAt) {
            throw new NotFoundException(
              `Produto ${item.productId} não encontrado`,
            );
          }
          productId = product.id;
        }

        const quantity = item.quantity ?? 1;
        const stockItem = await this.repo.upsertItemWithIncrement(
          tx,
          {
            productId,
            sellerId: userId,
            finish: item.finish ?? Finish.NONFOIL,
            condition: item.condition ?? Condition.NM,
            language: item.language ?? "pt",
          },
          quantity,
          item.priceCents,
        );

        const movement = await this.repo.createMovement(tx, {
          stockItemId: stockItem.id,
          type: MovementType.IN,
          quantityDelta: quantity,
          balanceAfter: stockItem.quantity,
          unitPriceCents: item.priceCents,
          supplier: dto.supplier ?? null,
          note: dto.note ?? null,
          actorId: userId,
        });

        entries.push({
          stockItemId: stockItem.id,
          productId,
          balanceAfter: stockItem.quantity,
          movementId: movement.id,
        });
      }

      return { entries };
    });
  }

  // Baixa ---------------------------------------------------------------------

  async createRemoval(stockItemId: string, dto: CreateRemovalDto) {
    if (dto.type === MovementType.IN) {
      throw new BadRequestException(
        "Entrada de estoque é pela rota POST /stock/entries",
      );
    }
    const userId = this.storeUserId;

    return this.prisma.$transaction(async (tx) => {
      const item = await this.repo.findItemById(tx, stockItemId);
      if (!item || item.deletedAt) {
        throw new NotFoundException("Item de estoque não encontrado");
      }
      // 409, não 400: o corpo da requisição está válido — é o ESTADO que
      // não comporta. O frontend mostra "só tem X em estoque".
      if (item.quantity < dto.quantity) {
        throw new ConflictException(
          `Saldo insuficiente: há ${item.quantity} em estoque`,
        );
      }

      const updated = await this.repo.decrementItem(
        tx,
        stockItemId,
        dto.quantity,
      );
      const movement = await this.repo.createMovement(tx, {
        stockItemId,
        type: dto.type,
        quantityDelta: -dto.quantity,
        balanceAfter: updated.quantity,
        // Congela o preço do momento: se omitido, o preço atual do item.
        unitPriceCents: dto.unitPriceCents ?? item.priceCents,
        supplier: null,
        note: dto.note ?? null,
        actorId: userId,
      });

      return {
        stockItemId,
        balanceAfter: updated.quantity,
        movementId: movement.id,
      };
    });
  }

  // Remoção do catálogo -------------------------------------------------------

  // A regra é automática, sem parâmetro do cliente:
  //   nunca teve movimento  -> apaga de verdade (não há o que auditar)
  //   tem histórico         -> zera via OUT + soft delete (some da loja,
  //                            permanece no extrato)
  async remove(stockItemId: string) {
    const userId = this.storeUserId;

    return this.prisma.$transaction(async (tx) => {
      const item = await this.repo.findItemById(tx, stockItemId);
      if (!item || item.deletedAt) {
        throw new NotFoundException("Item de estoque não encontrado");
      }

      const movementCount = await this.repo.countMovements(tx, stockItemId);
      if (movementCount === 0) {
        await this.repo.hardDeleteItem(tx, stockItemId);
        return { stockItemId, deleted: "hard" as const };
      }

      if (item.quantity > 0) {
        const updated = await this.repo.decrementItem(
          tx,
          stockItemId,
          item.quantity,
        );
        await this.repo.createMovement(tx, {
          stockItemId,
          type: MovementType.OUT,
          quantityDelta: -item.quantity,
          balanceAfter: updated.quantity,
          unitPriceCents: item.priceCents,
          supplier: null,
          note: "Remoção do catálogo",
          actorId: userId,
        });
      }
      await this.repo.softDeleteItem(tx, stockItemId);
      return { stockItemId, deleted: "soft" as const };
    });
  }

  // Leituras ------------------------------------------------------------------

  list(query: ListStockQuery) {
    return this.repo.listItems(
      this.prisma,
      {
        productId: query.productId,
        externalId: query.externalId,
        search: query.search,
      },
      query.take ?? 50,
      query.skip ?? 0,
    );
  }

  async findOne(stockItemId: string) {
    const item = await this.repo.findItemById(this.prisma, stockItemId);
    if (!item || item.deletedAt) {
      throw new NotFoundException("Item de estoque não encontrado");
    }
    return item;
  }

  async updatePrice(stockItemId: string, priceCents: number) {
    await this.findOne(stockItemId); // garante que existe e não foi removido
    return this.repo.updatePrice(this.prisma, stockItemId, priceCents);
  }

  async listMovements(stockItemId: string) {
    // Aqui NÃO filtramos deletedAt: o extrato de um item removido
    // continua consultável — é o ponto do soft delete.
    const item = await this.repo.findItemById(this.prisma, stockItemId);
    if (!item) {
      throw new NotFoundException("Item de estoque não encontrado");
    }
    return this.repo.listMovements(this.prisma, stockItemId);
  }
}
