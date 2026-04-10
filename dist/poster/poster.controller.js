"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const poster_service_1 = require("./poster.service");
let PosterController = class PosterController {
    posterService;
    constructor(posterService) {
        this.posterService = posterService;
    }
    postNow(req, listingId) {
        return this.posterService.postListing(listingId, req.user.id);
    }
    schedule(req, listingId, body) {
        return this.posterService.scheduleListingAt(listingId, req.user.id, new Date(body.scheduledAt));
    }
};
exports.PosterController = PosterController;
__decorate([
    (0, common_1.Post)('post/:listingId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PosterController.prototype, "postNow", null);
__decorate([
    (0, common_1.Post)('schedule/:listingId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('listingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PosterController.prototype, "schedule", null);
exports.PosterController = PosterController = __decorate([
    (0, common_1.Controller)('api/poster'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [poster_service_1.PosterService])
], PosterController);
//# sourceMappingURL=poster.controller.js.map