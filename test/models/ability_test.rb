require "test_helper"

class AbilityTest < ActiveSupport::TestCase
  setup do
    @alice = users(:alice)
    @bob = users(:bob)
    @alices_article = articles(:alices)
    @alice_comment = comments(:alice_on_bobs)
  end

  test "guest cannot mutate anything" do
    ability = Ability.new(nil)

    assert ability.cannot?(:update, @alices_article)
    assert ability.cannot?(:destroy, @alices_article)
    assert ability.cannot?(:destroy, @alice_comment)
    assert ability.cannot?(:update, @alice)
  end

  test "owner can update and destroy own article and comment" do
    ability = Ability.new(@alice)

    assert ability.can?(:update, @alices_article)
    assert ability.can?(:destroy, @alices_article)
    assert ability.can?(:destroy, @alice_comment)
  end

  test "other user cannot mutate another users article or comment" do
    ability = Ability.new(@bob)

    assert ability.cannot?(:update, @alices_article)
    assert ability.cannot?(:destroy, @alices_article)
    assert ability.cannot?(:destroy, @alice_comment)
  end

  test "user can update self for settings chrome" do
    ability = Ability.new(@alice)

    assert ability.can?(:update, @alice)
    assert ability.cannot?(:update, @bob)
  end
end
