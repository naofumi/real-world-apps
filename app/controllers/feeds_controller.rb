class FeedsController < ApplicationController
  def show
    @page = page_of(Article.recent.from_followed_by(Current.user).includes(:user, :tags))
    @favorited_ids = favorited_ids_among(@page.records)
    @tags = Tag.popular
  end
end
