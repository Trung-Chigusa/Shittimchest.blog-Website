import type { Post, UserRole, UserStatus } from "@prisma/client";

export type Actor = {
  id: string;
  role: UserRole;
  status: UserStatus;
};

export function isActive(actor: Actor) {
  return actor.status === "ACTIVE";
}

export function canModerate(actor: Actor) {
  return isActive(actor) && ["MODERATOR", "ADMIN"].includes(actor.role);
}

export function canManageUsers(actor: Actor) {
  return isActive(actor) && actor.role === "ADMIN";
}

export function canPublishDirectly(actor: Actor) {
  return isActive(actor) && ["AUTHOR", "MODERATOR", "ADMIN"].includes(actor.role);
}

export function canWrite(actor: Actor) {
  return isActive(actor) && actor.status !== "SUSPENDED";
}

export function canEditPost(actor: Actor, post: Pick<Post, "authorId">) {
  return canModerate(actor) || post.authorId === actor.id;
}
