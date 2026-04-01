import { Hono } from "hono";
import { listUsersController, getUserController,updateUserController,deleteUserController } from "./users.controlers";

export const usersRouter = new Hono();

usersRouter.get("/users", listUsersController);
usersRouter.get("/users/:id", getUserController);
usersRouter.put("/users/:id", updateUserController);   
usersRouter.delete("/users/:id", deleteUserController);
