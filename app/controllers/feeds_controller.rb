class FeedsController < ApplicationController
  def show
    @page = page_of(Article.recent.from_followed_by(Current.user).includes(:user, :tags))
    @tags = Tag.popular
  end
end
