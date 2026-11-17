class AddProfileToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :username, :string, null: false
    add_column :users, :bio, :text
    add_column :users, :image, :string
    add_index :users, "LOWER(username)", unique: true
  end
end
