class Articles::FavoritesController < ApplicationController
  before_action :set_article

  def create
    Current.user.favorites.find_or_create_by!(article: @article)
    @article.reload

    respond_to do |format|
      format.turbo_stream { render :update }
      format.html { redirect_back_or_to @article, status: :see_other }
    end
  end

  def destroy
    Current.user.favorites.find_by(article: @article)&.destroy
    @article.reload

    respond_to do |format|
      format.turbo_stream { render :update }
      format.html { redirect_back_or_to @article, status: :see_other }
    end
  end

  private
    def set_article
      @article = Article.find_by!(slug: params[:article_id])
    end
end
