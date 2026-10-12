require "test_helper"

class CommentsControllerTest < ActionDispatch::IntegrationTest
  test "creating a comment requires authentication" do
    post article_comments_path(articles(:bobs)), params: { comment: { body: "Hello" } }

    assert_redirected_to new_session_path
    assert_equal 1, articles(:bobs).comments.count
  end

  test "create adds a comment" do
    sign_in_as users(:bob)

    assert_difference -> { articles(:alices).comments.count }, 1 do
      post article_comments_path(articles(:alices)), params: { comment: { body: "Nice post" } }
    end

    assert_redirected_to article_path(articles(:alices))
  end

  test "author can delete a comment" do
    sign_in_as users(:alice)

    assert_difference -> { Comment.count }, -1 do
      delete article_comment_path(articles(:bobs), comments(:alice_on_bobs))
    end

    assert_redirected_to article_path(articles(:bobs))
  end

  test "other users cannot delete a comment" do
    sign_in_as users(:bob)

    assert_no_difference -> { Comment.count } do
      delete article_comment_path(articles(:bobs), comments(:alice_on_bobs))
    end

    assert_redirected_to article_path(articles(:bobs))
  end
end
