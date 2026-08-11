import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  // FastifyAdapter: o Nest roda sobre o Fastify em vez do Express padrão.
  // Mesma API do Nest, servidor mais rápido embaixo.
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Todas as rotas ganham o prefixo /api — casa com o proxy do Vite em dev.
  app.setGlobalPrefix("api");

  // Valida TODO corpo de requisição contra o DTO da rota, automaticamente:
  //   whitelist: campos que não estão no DTO são descartados em silêncio
  //   transform: converte o JSON cru na instância da classe do DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port, "0.0.0.0");
  console.log(`API no ar em http://localhost:${port}/api`);
}

bootstrap();
