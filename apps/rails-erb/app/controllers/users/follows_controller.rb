class Users::FollowsController < ApplicationController
  before_action :set_user

  def create
    Current.user.follow(@user)

    respond_to do |format|
      format.turbo_stream { render :update }
      format.html { redirect_back_or_to @user, status: :see_other }
    end
  end

  def destroy
    Current.user.unfollow(@user)

    respond_to do |format|
      format.turbo_stream { render :update }
      format.html { redirect_back_or_to @user, status: :see_other }
    end
  end

  private
    def set_user
      @user = User.find_by_username!(params[:user_id])
    end
end
