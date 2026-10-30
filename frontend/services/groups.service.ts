import { api } from "./api";
import { TokenService } from "./token.service";

export interface GroupUser {
  id: string;
  uniqueName: string;
  displayName: string;
  avatarThumbnailUrl?: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  joinedAt: string;
  memberCount: number;
}

export interface GroupMember extends GroupUser {
  joinedAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  members: GroupMember[];
  invitations: { id: string; createdAt: string; invitee: GroupUser; invitedById: string }[];
}

export interface ReceivedInvitation {
  id: string;
  createdAt: string;
  group: { id: string; name: string; memberCount: number };
  invitedBy: GroupUser;
}

export interface GroupRecord {
  exercise: { id: string; name: string };
  type: string;
  value: number;
  unit: string;
}

export type GroupEvent =
  | {
      type: "workout";
      postId: string;
      at: string;
      user: GroupUser;
      workout: { id: string; title: string };
      records: GroupRecord[];
    }
  | {
      type: "share";
      shareId: string;
      postId: string;
      at: string;
      user: GroupUser;
      author: GroupUser;
      workout: { id: string; title: string };
    };

async function call<T>(
  method: "get" | "post" | "patch" | "delete",
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const token = (await TokenService.get()) ?? undefined;
  if (method === "get" || method === "delete") return api[method]<T>(endpoint, token);
  return api[method]<T>(endpoint, body ?? {}, token);
}

const id = encodeURIComponent;

export const GroupsService = {
  list: () => call<GroupSummary[]>("get", "/groups"),
  create: (name: string) => call<GroupDetail>("post", "/groups", { name }),
  get: (groupId: string) => call<GroupDetail>("get", `/groups/${id(groupId)}`),
  rename: (groupId: string, name: string) =>
    call<GroupDetail>("patch", `/groups/${id(groupId)}`, { name }),
  remove: (groupId: string) => call<{ deleted: boolean }>("delete", `/groups/${id(groupId)}`),
  leave: (groupId: string) =>
    call<{ left: boolean }>("delete", `/groups/${id(groupId)}/members/me`),

  /** Pseudo avec ou sans `@`. `403` : pas de suivi mutuel ; `409` : déjà membre/invité ou groupe complet. */
  invite: (groupId: string, uniqueName: string) =>
    call<GroupDetail["invitations"]>("post", `/groups/${id(groupId)}/invitations`, {
      uniqueName: uniqueName.trim(),
    }),
  receivedInvitations: () => call<ReceivedInvitation[]>("get", "/groups/invitations"),
  accept: (invitationId: string) =>
    call<GroupDetail>("post", `/groups/invitations/${id(invitationId)}/accept`),
  decline: (invitationId: string) =>
    call<{ declined: boolean }>("delete", `/groups/invitations/${id(invitationId)}`),

  /** `409` si le post est déjà partagé dans ce groupe. */
  share: (groupId: string, postId: string) =>
    call<{ id: string; postId: string; createdAt: string }>(
      "post",
      `/groups/${id(groupId)}/shares`,
      { postId },
    ),
  removeShare: (groupId: string, shareId: string) =>
    call<{ deleted: boolean }>("delete", `/groups/${id(groupId)}/shares/${id(shareId)}`),

  /** Page suivante : `before` = `at` du dernier événement reçu. */
  activity: (groupId: string, opts: { limit?: number; before?: string } = {}) => {
    const query = new URLSearchParams();
    if (opts.limit) query.set("limit", String(opts.limit));
    if (opts.before) query.set("before", opts.before);
    const qs = query.toString();
    return call<GroupEvent[]>("get", `/groups/${id(groupId)}/activity${qs ? `?${qs}` : ""}`);
  },
};
