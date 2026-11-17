import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/client.js";
import { loginLocationState } from "../../lib/login-state.js";

export function FollowButton({
  username,
  following,
  canFollow,
}: {
  username: string;
  following: boolean;
  canFollow: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
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
        if (!canFollow) {
          navigate("/login", { state: loginLocationState(location.pathname, location.search) });
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
