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
end
