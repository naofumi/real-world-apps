require "test_helper"

class ArticlesControllerTest < ActionDispatch::IntegrationTest
  test "index is public and filters by tag" do
    get root_path(tag: "dragons")

    assert_response :success
    assert_select ".article-preview", count: 1
    assert_select "h1", "Training Dragons"
  end

  test "index paginates" do
    10.times do |i|
      users(:alice).articles.create!(title: "Extra #{i}", description: "About", body: "Body", created_at: i.minutes.from_now)
    end

    get root_path(page: 2)

    assert_response :success
    assert_select ".page-item.active", text: "2"
  end

  test "show is public" do
    get article_path(articles(:alices))

    assert_response :success
    assert_select "h1", "Alice on Rails"
  end

  test "creating an article requires authentication" do
    get new_article_path
    assert_redirected_to new_session_path

    post articles_path, params: { article: { title: "Nope", description: "Nope", body: "Nope" } }
    assert_redirected_to new_session_path
  end

  test "create publishes an article with tags" do
    sign_in_as users(:alice)

    assert_difference -> { Article.count }, 1 do
      post articles_path, params: { article: { title: "New Post", description: "A description", body: "The body", tag_list: "Rails, Hotwire" } }
    end

    article = Article.find_by!(slug: "new-post")
    assert_redirected_to article_path(article)
    assert_equal %w[hotwire rails], article.tags.map(&:name).sort
  end

  test "create with invalid data renders the form" do
    sign_in_as users(:alice)

    post articles_path, params: { article: { title: "", description: "", body: "" } }

    assert_response :unprocessable_entity
  end

  test "author can update and the slug follows the title" do
    sign_in_as users(:alice)

    patch article_path(articles(:alices)), params: { article: { title: "Renamed title", description: "A first post", body: "Rails is **enough**.", tag_list: "rails" } }

    assert_redirected_to article_path("renamed-title")
    assert_equal "renamed-title", articles(:alices).reload.slug
  end

  test "other users cannot update or delete an article" do
    sign_in_as users(:bob)

    patch article_path(articles(:alices)), params: { article: { title: "Hijacked" } }
    assert_redirected_to article_path(articles(:alices))
    assert_equal "Alice on Rails", articles(:alices).reload.title

    assert_no_difference -> { Article.count } do
      delete article_path(articles(:alices))
    end
    assert_redirected_to article_path(articles(:alices))
  end

  test "author can delete an article" do
    sign_in_as users(:alice)

    delete article_path(articles(:alices))

    assert_redirected_to root_path
    assert_not Article.exists?(slug: "alice-on-rails")
  end
end
