class UsersController < ApplicationController
  allow_unauthenticated_access only: :show

  def show
    @user = User.find_by_username!(params[:id])
    @page = page_of(@user.articles.recent.includes(:user, :tags))
    @favorited_ids = favorited_ids_among(@page.records)
  end
end
