class Users::FollowsController < ApplicationController
  before_action :set_user

  def create
    Current.user.follow(@user)
    redirect_back_or_to @user, status: :see_other
  end

  def destroy
    Current.user.unfollow(@user)
    redirect_back_or_to @user, status: :see_other
  end

  private
    def set_user
      @user = User.find_by_username!(params[:user_id])
    end
end
