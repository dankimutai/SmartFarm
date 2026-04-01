"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerRouter = void 0;
const hono_1 = require("hono");
const buyers_controller_1 = require("./buyers.controller");
exports.buyerRouter = new hono_1.Hono();
exports.buyerRouter.get('/buyers', buyers_controller_1.buyerController.getAll); // Get all buyers
exports.buyerRouter.get('/buyers/:id', buyers_controller_1.buyerController.getById); // Get buyer by ID
exports.buyerRouter.put('/buyers/:id', buyers_controller_1.buyerController.update); // Update buyer by ID
exports.buyerRouter.delete('/buyers/:id', buyers_controller_1.buyerController.delete);
