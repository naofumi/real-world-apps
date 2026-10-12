require "test_helper"

class Users::FavoritesControllerTest < ActionDispatch::IntegrationTest
  test "index lists articles the user favorited" do
    get user_favorites_path(users(:alice))

    assert_response :success
    assert_select ".nav-link.active", text: "Favorited Articles"
    assert_select "h1", text: "Training Dragons"
    assert_select "h1", text: "Alice on Rails", count: 0
  end
end
