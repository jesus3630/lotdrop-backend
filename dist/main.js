"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
        logger: ['log', 'error', 'warn'],
    });
    app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:4201', credentials: true });
    app.use((req, res, next) => {
        const auth = req.headers.authorization ? 'Bearer ***' : 'none';
        console.log(`${req.method} ${req.path} | auth: ${auth} | origin: ${req.headers.origin || '-'}`);
        next();
    });
    await app.listen(process.env.PORT ?? 3001);
    console.log(`LotDrop API running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
//# sourceMappingURL=main.js.map