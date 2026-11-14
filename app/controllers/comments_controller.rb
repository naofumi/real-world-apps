class CommentsController < ApplicationController
  before_action :set_article

  def create
    @comment = @article.comments.new(comment_params)
    @comment.user = Current.user

    if @comment.save
      redirect_to @article, notice: "Comment posted."
    else
      @comments = @article.comments.oldest_first.includes(:user)
      render "articles/show", status: :unprocessable_entity
    end
  end

  def destroy
    comment = @article.comments.find(params[:id])
    return unless authorize_or_redirect(:destroy, comment, to: @article, alert: "You can only delete your own comments.", status: :see_other)

    comment.destroy!
    redirect_to @article, notice: "Comment deleted.", status: :see_other
  end

  private
    def set_article
      @article = Article.find_by!(slug: params[:article_id])
    end

    def comment_params
      params.expect(comment: [ :body ])
    end
end
