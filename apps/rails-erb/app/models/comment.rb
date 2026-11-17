class Comment < ApplicationRecord
  belongs_to :article
  belongs_to :user

  validates :body, presence: true

  scope :oldest_first, -> { order(created_at: :asc) }

  def authored_by?(author)
    user_id == author&.id
  end
end
