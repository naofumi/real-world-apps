# Authorization chrome only. Domain invariants (self-follow, uniqueness,
# authorship predicates, follow/favorite mechanics) live on the models —
# do not grow Ability into a second place for those rules (the Pundit trap).
class Ability
  include CanCan::Ability

  # @param user [User, nil] — pass Current.user; nil = guest
  def initialize(user)
    return if user.blank?

    can [ :update, :destroy ], Article, user: user
    can :destroy, Comment, user: user
    can :update, User, id: user.id
  end
end
