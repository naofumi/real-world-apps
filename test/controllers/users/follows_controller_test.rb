require "test_helper"

class Users::FollowsControllerTest < ActionDispatch::IntegrationTest
  test "following requires authentication" do
    post user_follow_path(users(:bob))

    assert_redirected_to new_session_path
  end

  test "create and destroy a follow" do
    sign_in_as users(:bob)

    assert_difference -> { Follow.count }, 1 do
      post user_follow_path(users(:alice))
    end
    assert users(:bob).reload.following?(users(:alice))

    assert_difference -> { Follow.count }, -1 do
      delete user_follow_path(users(:alice))
    end
    assert_not users(:bob).reload.following?(users(:alice))
  end

  test "turbo stream replaces every follow button for the user" do
    sign_in_as users(:bob)

    post user_follow_path(users(:alice)), as: :turbo_stream

    assert_response :success
    assert_turbo_stream action: "replace", targets: ".follow_user_#{users(:alice).id}" do
      assert_select "button", text: /Unfollow alice/
    end

    delete user_follow_path(users(:alice)), as: :turbo_stream

    assert_response :success
    assert_turbo_stream action: "replace", targets: ".follow_user_#{users(:alice).id}" do
      assert_select "button.btn-outline-secondary", text: /Follow alice/
    end
  end

  test "a user cannot follow themselves" do
    sign_in_as users(:alice)

    assert_no_difference -> { Follow.count } do
      post user_follow_path(users(:alice))
    end
    assert_not users(:alice).following?(users(:alice))
  end
end
