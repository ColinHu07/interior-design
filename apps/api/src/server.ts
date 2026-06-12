import cors from "@fastify/cors";
import { seedProducts } from "@interior/catalog";
import { generateDesignCards, generateDesignCardsInputSchema } from "@interior/recommendation";
import Fastify from "fastify";

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });

  await server.register(cors, {
    origin: process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(",") : true
  });

  server.get("/api/health", async () => ({
    ok: true,
    service: "interior-design-api",
    version: "0.1.0"
  }));

  server.get("/api/catalog", async () => ({
    products: seedProducts
  }));

  server.post("/api/design-cards", async (request, reply) => {
    const parsed = generateDesignCardsInputSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.flatten()
      });
    }

    return generateDesignCards(parsed.data);
  });

  return server;
}

