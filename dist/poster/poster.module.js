"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterModule = void 0;
const common_1 = require("@nestjs/common");
const facebook_service_1 = require("./facebook.service");
const poster_service_1 = require("./poster.service");
const poster_controller_1 = require("./poster.controller");
const listings_module_1 = require("../listings/listings.module");
const users_module_1 = require("../users/users.module");
let PosterModule = class PosterModule {
};
exports.PosterModule = PosterModule;
exports.PosterModule = PosterModule = __decorate([
    (0, common_1.Module)({
        imports: [listings_module_1.ListingsModule, users_module_1.UsersModule],
        providers: [facebook_service_1.FacebookService, poster_service_1.PosterService],
        controllers: [poster_controller_1.PosterController],
        exports: [poster_service_1.PosterService],
    })
], PosterModule);
//# sourceMappingURL=poster.module.js.map