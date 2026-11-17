class ArticlesController < ApplicationController
  allow_unauthenticated_access only: %i[ index show ]

  before_action :set_article, only: %i[ show edit update destroy ]
  before_action :authorize_article!, only: %i[ edit update destroy ]

  def index
    articles = listed_articles
    articles = articles.tagged_with(params[:tag]) if params[:tag].present?
    @tag = params[:tag]
    @page = page_of(articles)
    @tags = Tag.popular
  end

  def show
    @comments = @article.comments.oldest_first.includes(:user)
    @comment = @article.comments.new
  end

  def new
    @article = Article.new
  end

  def create
    @article = Current.user.articles.new(article_params)

    if @article.save
      redirect_to @article, notice: "Article published."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @article.update(article_params)
      redirect_to @article, notice: "Article updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @article.destroy!
    redirect_to root_path, notice: "Article deleted.", status: :see_other
  end

  private
    def set_article
      @article = Article.find_by!(slug: params[:id])
    end

    def authorize_article!
      action = action_name == "destroy" ? :destroy : :update
      authorize_or_redirect(action, @article, to: @article, alert: "You can only change your own articles.")
    end

    def article_params
      params.expect(article: [ :title, :description, :body, :tag_list ])
    end

    def listed_articles
      Article.recent.includes(:user, :tags).preload(:favorite_by_current_user)
    end
end
