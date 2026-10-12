import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";

export function FollowButton({ username, following }: { username: string; following: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => (following ? api.unfollow(username) : api.follow(username)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", username] });
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
      await queryClient.invalidateQueries({ queryKey: ["article"] });
      await queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  return (
    <button
      type="button"
      className={`btn btn-sm action-btn ${following ? "btn-secondary" : "btn-outline-secondary"}`}
      disabled={mutation.isPending}
      onClick={() => {
        if (!me.data) {
          navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
          return;
        }
        mutation.mutate();
      }}
    >
      <i className={following ? "ion-close-round" : "ion-plus-round"} />
      &nbsp; {following ? "Unfollow" : "Follow"} {username}
    </button>
  );
}
