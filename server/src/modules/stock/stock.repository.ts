import { Injectable } from "@nestjs/common";
import {
  Condition,
  Finish,
  MovementType,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";
import { ScryfallProductData } from "./scryfall.service";

// ============================================================================
// Repository: acesso a dados, e SÓ isso. Nenhuma regra de negócio.
//
// Todo método recebe `db` como primeiro parâmetro: pode ser o PrismaClient
// normal ou um TransactionClient. É o que permite ao service embrulhar
// várias chamadas numa transação só — o `tx` atravessa o repository.
// Existe principalmente pela testabilidade: o service pode receber um
// repository falso e ser testado sem banco.
// ============================================================================

export type Db = PrismaClient | Prisma.TransactionClient;

export interface StockItemKey {
  productId: string;
  sellerId: string;
  finish: Finish;
  condition: Condition;
  language: string;
}

export interface CreateMovementData {
  stockItemId: string;
  type: MovementType;
  quantityDelta: number;
  balanceAfter: number;
  unitPriceCents: number;
  supplier: string | null;
  note: string | null;
  actorId: string;
}

@Injectable()
export class StockRepository {
  // Product ------------------------------------------------------------------

  upsertScryfallProduct(db: Db, data: ScryfallProductData) {
    const fields = {
      name: data.name,
      setCode: data.setCode ?? null,
      setName: data.setName ?? null,
      collectorNumber: data.collectorNumber ?? null,
      imageUrl: data.imageUrl ?? null,
    };
    return db.product.upsert({
      where: {
        source_externalId: {
          source: "SCRYFALL",
          externalId: data.externalId,
        },
      },
      // Atualizar no upsert mantém o catálogo fresco (Scryfall corrige
      // nomes/imagens) e ressuscita produto soft-deletado que voltou.
      update: { ...fields, deletedAt: null },
      create: {
        kind: "CARD",
        source: "SCRYFALL",
        externalId: data.externalId,
        ...fields,
      },
    });
  }

  findProductById(db: Db, id: string) {
    return db.product.findUnique({ where: { id } });
  }

  // StockItem ----------------------------------------------------------------

  // Uma chamada só: se a variante não existe, cria com a quantidade;
  // se existe, incrementa. O retorno já traz o saldo atualizado —
  // é o balanceAfter do movimento, sem consulta extra.
  upsertItemWithIncrement(
    db: Db,
    key: StockItemKey,
    quantity: number,
    priceCents: number
  ) {
    return db.stockItem.upsert({
      where: { productId_sellerId_finish_condition_language: key },
      create: { ...key, quantity, priceCents },
      // priceCents no update: a última entrada define o preço de venda
      // atual. deletedAt: null ressuscita item removido que voltou ao estoque.
      update: {
        quantity: { increment: quantity },
        priceCents,
        deletedAt: null,
      },
    });
  }

  findItemById(db: Db, id: string) {
    return db.stockItem.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  decrementItem(db: Db, id: string, quantity: number) {
    return db.stockItem.update({
      where: { id },
      data: { quantity: { decrement: quantity } },
    });
  }

  updatePrice(db: Db, id: string, priceCents: number) {
    return db.stockItem.update({ where: { id }, data: { priceCents } });
  }

  softDeleteItem(db: Db, id: string) {
    return db.stockItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  hardDeleteItem(db: Db, id: string) {
    return db.stockItem.delete({ where: { id } });
  }

  listItems(
    db: Db,
    filter: { productId?: string; externalId?: string; search?: string },
    take: number,
    skip: number
  ) {
    // externalId e search filtram pelo PRODUTO relacionado, não pelo item.
    // Montamos um objeto só: dois spreads com a chave `product` fariam o
    // segundo sobrescrever o primeiro em silêncio.
    const productFilter: Prisma.ProductWhereInput = {
      // source junto do externalId porque a unicidade no schema é do PAR
      // (source, externalId) — id do Scryfall só é único dentro do Scryfall.
      ...(filter.externalId
        ? { source: "SCRYFALL", externalId: filter.externalId }
        : {}),
      ...(filter.search
        ? { name: { contains: filter.search, mode: "insensitive" } }
        : {}),
    };

    const where: Prisma.StockItemWhereInput = {
      deletedAt: null,
      ...(filter.productId ? { productId: filter.productId } : {}),
      ...(Object.keys(productFilter).length > 0
        ? { product: productFilter }
        : {}),
    };
    return db.stockItem.findMany({
      where,
      include: { product: true },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });
  }

  // StockMovement ------------------------------------------------------------

  createMovement(db: Db, data: CreateMovementData) {
    return db.stockMovement.create({ data });
  }

  countMovements(db: Db, stockItemId: string) {
    return db.stockMovement.count({ where: { stockItemId } });
  }

  listMovements(db: Db, stockItemId: string) {
    return db.stockMovement.findMany({
      where: { stockItemId },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { occurredAt: "desc" },
    });
  }
}
