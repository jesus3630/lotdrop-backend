"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const listings_module_1 = require("./listings/listings.module");
const templates_module_1 = require("./templates/templates.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const images_module_1 = require("./images/images.module");
const poster_module_1 = require("./poster/poster.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => {
                    const url = config.get('DATABASE_URL');
                    if (url) {
                        return { type: 'postgres', url, autoLoadEntities: true, synchronize: true, ssl: { rejectUnauthorized: false } };
                    }
                    return {
                        type: 'postgres',
                        host: config.get('DB_HOST'),
                        port: +(config.get('DB_PORT') ?? 5432),
                        username: config.get('DB_USERNAME'),
                        password: config.get('DB_PASSWORD'),
                        database: config.get('DB_NAME'),
                        autoLoadEntities: true,
                        synchronize: true,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            listings_module_1.ListingsModule,
            templates_module_1.TemplatesModule,
            campaigns_module_1.CampaignsModule,
            images_module_1.ImagesModule,
            poster_module_1.PosterModule,
            subscriptions_module_1.SubscriptionsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map