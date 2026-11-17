class UsersController < ApplicationController
  allow_unauthenticated_access only: :show

  def show
    @user = User.find_by_username!(params[:id])
    @page = page_of(@user.articles.recent.includes(:user, :tags).preload(:favorite_by_current_user))
  end
end
