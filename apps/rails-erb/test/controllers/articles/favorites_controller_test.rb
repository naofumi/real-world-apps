require "test_helper"

class Articles::FavoritesControllerTest < ActionDispatch::IntegrationTest
  test "favoriting requires authentication" do
    post article_favorite_path(articles(:alices))

    assert_redirected_to new_session_path
    assert_equal 0, articles(:alices).reload.favorites_count
  end

  test "create and destroy toggle the favorite" do
    sign_in_as users(:bob)

    assert_difference -> { articles(:alices).reload.favorites_count }, 1 do
      post article_favorite_path(articles(:alices))
    end
    assert_redirected_to article_path(articles(:alices))

    assert_difference -> { articles(:alices).reload.favorites_count }, -1 do
      delete article_favorite_path(articles(:alices))
    end
  end

  test "favoriting twice does not duplicate" do
    sign_in_as users(:alice)

    assert_no_difference -> { Favorite.count } do
      post article_favorite_path(articles(:bobs))
    end
  end

  test "turbo stream replaces every favorite button for the article" do
    sign_in_as users(:bob)
    article = articles(:alices)

    post article_favorite_path(article), as: :turbo_stream

    assert_response :success
    assert_turbo_stream action: "replace", targets: ".favorite_article_#{article.id}" do
      assert_select ".favorite__label", text: /Unfavorite Article \(1\)/
      assert_select ".favorite__count", text: "1"
    end

    delete article_favorite_path(article), as: :turbo_stream

    assert_response :success
    assert_turbo_stream action: "replace", targets: ".favorite_article_#{article.id}" do
      assert_select ".favorite__label", text: /Favorite Article \(0\)/
      assert_select ".favorite__count", text: "0"
    end
  end
end
