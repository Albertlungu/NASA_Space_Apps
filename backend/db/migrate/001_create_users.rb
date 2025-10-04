class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :name
      t.string :phone
      t.float :cumulative_exposure, default: 0.0
      t.integer :alert_threshold, default: 100
      t.text :notification_preferences # JSON stored as text
      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
