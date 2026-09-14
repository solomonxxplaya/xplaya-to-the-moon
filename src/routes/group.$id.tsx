import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Flag, Search, Shield, UserMinus, UserRound } from "lucide-react";
import { Screen, SectionHeading } from "@/components/layout/Screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useFriends } from "@/lib/friends";
import {
  canDo,
  defaultGroupPermissions,
  isGroupAdmin,
  isGroupOwner,
  isMember as isMemberOf,
  roleOf,
  type GroupPermission,
  type GroupPermissions,
} from "@/lib/messaging/model";
import {
  addGroupMembers,
  leaveGroup,
  removeGroupMember,
  reportConversation,
  setGroupRole,
  transferGroupOwnership,
  updateGroupInfo,
  updateGroupPermissions,
  useAction,
  useConversation,
  useProfiles,
} from "@/lib/messaging/service";
import { toast } from "sonner";

export const Route = createFileRoute("/group/$id")({
  head: () => ({
    meta: [
      { title: "Group settings — XPLAYA" },
      { name: "description", content: "Manage your XPLAYA group: members, roles and permissions." },
      { property: "og:title", content: "Group settings — XPLAYA" },
      {
        property: "og:description",
        content: "Manage your XPLAYA group: members, roles and permissions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GroupSettingsScreen,
});

const permissionOptions: GroupPermission[] = ["owner", "admins", "members"];
const permissionLabel: Record<GroupPermission, string> = {
  owner: "Owner only",
  admins: "Admins",
  members: "Everyone",
};

function GroupSettingsScreen() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { uid, isAuthenticated } = useAuth();
  const { data: conversation, loading } = useConversation(id);
  const profiles = useProfiles(conversation?.memberIds ?? []);
  const { busy, run } = useAction();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState("");
  const { data: friends } = useFriends(uid ?? null, term);

  useEffect(() => {
    if (conversation) {
      setName(conversation.name ?? "");
      setDescription(conversation.description ?? "");
    }
  }, [conversation?.id, conversation?.name, conversation?.description]);

  if (!isAuthenticated) {
    return (
      <Screen title="Group">
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-neon">
            Log in
          </Link>{" "}
          to manage your groups.
        </p>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen title="Group">
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
      </Screen>
    );
  }

  if (!conversation || conversation.type !== "group" || !isMemberOf(conversation, uid)) {
    return (
      <Screen title="Group">
        <p className="mt-8 text-center text-sm text-muted-foreground">
          This group is not available to you.
        </p>
      </Screen>
    );
  }

  const permissions: GroupPermissions = conversation.permissions ?? defaultGroupPermissions;
  const owner = isGroupOwner(conversation, uid);
  const admin = isGroupAdmin(conversation, uid);
  const canEditInfo = canDo(conversation, uid, permissions.editInfo);
  const canAdd = canDo(conversation, uid, permissions.addMembers);

  const guard = (fn: () => Promise<unknown>, failure: string) =>
    void run(async () => {
      try {
        await fn();
      } catch {
        toast.error(failure);
      }
    });

  return (
    <Screen
      title={conversation.name || "Group"}
      subtitle={`${conversation.memberIds.length} members`}
      action={
        <button onClick={() => void navigate({ to: "/chat/$id", params: { id } })} aria-label="Back" className="press">
          <ArrowLeft className="h-5 w-5" />
        </button>
      }
    >
      <SectionHeading>Group info</SectionHeading>
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEditInfo}
          maxLength={60}
          placeholder="Group name"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEditInfo}
          maxLength={200}
          rows={3}
          placeholder="Description"
        />
        {canEditInfo ? (
          <Button
            disabled={busy}
            className="w-full rounded-full font-semibold"
            onClick={() =>
              guard(
                () => updateGroupInfo(conversation.id, { name, description }),
                "Could not save the group info.",
              )
            }
          >
            Save group info
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Only {permissionLabel[permissions.editInfo].toLowerCase()} can edit this group.
          </p>
        )}
      </div>

      {admin ? (
        <div className="mt-7">
          <SectionHeading>Permissions</SectionHeading>
          <div className="space-y-3">
            {(
              [
                ["addMembers", "Who can add members"],
                ["editInfo", "Who can edit group info"],
                ["sendMessages", "Who can send messages"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="surface-panel rounded-2xl p-3">
                <p className="mb-2 text-xs font-semibold">{label}</p>
                <div className="flex gap-2">
                  {permissionOptions.map((option) => (
                    <button
                      key={option}
                      disabled={busy || (!owner && option === "owner")}
                      onClick={() =>
                        guard(
                          () =>
                            updateGroupPermissions(conversation.id, {
                              ...permissions,
                              [key]: option,
                            }),
                          "Could not update permissions.",
                        )
                      }
                      className={
                        permissions[key] === option
                          ? "rounded-full bg-neon px-3 py-1 text-[10px] font-bold text-primary-foreground"
                          : "rounded-full border border-border px-3 py-1 text-[10px] font-bold text-muted-foreground disabled:opacity-40"
                      }
                    >
                      {permissionLabel[option]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-7">
        <SectionHeading>Members</SectionHeading>
        <ul className="space-y-2">
          {conversation.memberIds.map((memberId) => {
            const profile = profiles[memberId];
            const role = roleOf(conversation, memberId) ?? "member";
            return (
              <li key={memberId} className="surface-panel flex items-center gap-3 rounded-2xl p-3">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="h-10 w-10 rounded-full bg-surface-2 object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">@{profile?.username ?? "player"}</p>
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {role}
                  </p>
                </div>
                {admin && memberId !== uid ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {role === "member" ? (
                      <button
                        aria-label="Make admin"
                        disabled={busy}
                        className="press"
                        onClick={() =>
                          guard(
                            () => setGroupRole(conversation.id, memberId, "admin"),
                            "Could not change that role.",
                          )
                        }
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : role === "admin" ? (
                      <button
                        aria-label="Remove admin"
                        disabled={busy}
                        className="press"
                        onClick={() =>
                          guard(
                            () => setGroupRole(conversation.id, memberId, "member"),
                            "Could not change that role.",
                          )
                        }
                      >
                        <Shield className="h-4 w-4 text-neon" />
                      </button>
                    ) : null}
                    {owner ? (
                      <button
                        aria-label="Transfer ownership"
                        disabled={busy}
                        className="press"
                        onClick={() =>
                          guard(
                            () => transferGroupOwnership(conversation, memberId),
                            "Could not transfer ownership.",
                          )
                        }
                      >
                        <Crown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : null}
                    <button
                      aria-label="Remove member"
                      disabled={busy}
                      className="press"
                      onClick={() =>
                        guard(
                          () => removeGroupMember(conversation.id, memberId),
                          "Could not remove that member.",
                        )
                      }
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {canAdd ? (
        <div className="mt-7">
          <SectionHeading>Add members</SectionHeading>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search players"
              className="rounded-full pl-9"
            />
          </div>
          <ul className="mt-3 space-y-2">
            {results
              .filter((u) => !conversation.memberIds.includes(u.uid))
              .map((u) => (
                <li key={u.uid}>
                  <button
                    disabled={busy}
                    onClick={() =>
                      guard(
                        () => addGroupMembers(conversation, [u.uid]),
                        "Could not add that player.",
                      )
                    }
                    className="surface-panel press flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-50"
                  >
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName}
                        className="h-10 w-10 rounded-full bg-surface-2 object-cover"
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
                        <UserRound className="h-5 w-5 text-muted-foreground" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">@{u.username}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <Button
          variant="outline"
          className="w-full rounded-full font-semibold"
          disabled={busy}
          onClick={() =>
            uid &&
            guard(
              () =>
                reportConversation({
                  reporterId: uid,
                  targetType: "group",
                  targetId: conversation.id,
                  reason: "Reported from group settings",
                }).then(() => toast.success("Report sent to XPLAYA moderation.")),
              "Could not send that report.",
            )
          }
        >
          <Flag className="mr-1 h-4 w-4" /> Report group
        </Button>
        <Button
          variant="destructive"
          className="w-full rounded-full font-semibold"
          disabled={busy}
          onClick={() =>
            uid &&
            guard(
              () => leaveGroup(conversation, uid).then(() => navigate({ to: "/inbox" })),
              "Could not leave the group.",
            )
          }
        >
          {owner ? "Leave (owner)" : "Leave group"}
        </Button>
      </div>
    </Screen>
  );
}
