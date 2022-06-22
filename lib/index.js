"use strict";
// import { NotFound } from '@feathersjs/memory'
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.Service = void 0;
class Service {
    constructor(options) {
        this.options = options;
    }
}
exports.Service = Service;
function prisma(options) {
    return new Service(options);
}
exports.prisma = prisma;
//# sourceMappingURL=index.js.map