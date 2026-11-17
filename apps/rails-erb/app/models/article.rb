class Article < ApplicationRecord
  belongs_to :user
  has_many :comments, dependent: :destroy
  has_many :taggings, dependent: :destroy
  has_many :tags, through: :taggings
  has_many :favorites, dependent: :destroy
  has_many :favoriters, through: :favorites, source: :user
  has_one :favorite_by_current_user, -> { Current.user ? where(user: Current.user) : none }, class_name: "Favorite"

  validates :title, :description, :body, presence: true
  validates :slug, presence: true, uniqueness: true

  before_validation :assign_slug, if: -> { title.present? && (new_record? || will_save_change_to_title?) }
  after_save :sync_tags, if: :tag_list_assigned?

  scope :recent, -> { order(arel_table[:created_at].desc) }
  scope :tagged_with, ->(name) {
    tag = Tag.find_by(name: name.to_s.strip.downcase)
    tag ? joins(:taggings).where(taggings: { tag_id: tag.id }) : none
  }
  scope :from_followed_by, ->(user) {
    where(user_id: Follow.where(follower_id: user.id).select(:followed_id))
  }

  def to_param
    slug
  end

  def authored_by?(author)
    user_id == author&.id
  end

  def tag_list
    return @tag_list if tag_list_assigned?

    tags.map(&:name).join(", ")
  end

  def tag_list=(value)
    @tag_list = value
    @tag_list_assigned = true
  end

  private
    def assign_slug
      base = title.to_s.parameterize.presence || "article"
      candidate = base
      suffix = 2

      while Article.where.not(id: id).exists?(slug: candidate)
        candidate = "#{base}-#{suffix}"
        suffix += 1
      end

      self.slug = candidate
    end

    def sync_tags
      names = @tag_list.to_s.split(",").map { |name| name.strip.downcase }.compact_blank.uniq
      self.tags = names.map { |name| Tag.find_or_create_by!(name: name) }
    end

    def tag_list_assigned?
      @tag_list_assigned
    end
end
