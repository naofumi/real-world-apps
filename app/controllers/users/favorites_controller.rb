class Users::FavoritesController < ApplicationController
  allow_unauthenticated_access

  def index
    @user = User.find_by_username!(params[:user_id])
    @page = page_of(@user.favorite_articles.recent.includes(:user, :tags))
  end
end
