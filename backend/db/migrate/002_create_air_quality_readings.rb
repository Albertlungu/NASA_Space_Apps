class CreateAirQualityReadings < ActiveRecord::Migration[7.1]
  def change
    create_table :air_quality_readings do |t|
      t.string :pollutant, null: false
      t.float :value, null: false
      t.string :unit
      t.float :latitude
      t.float :longitude
      t.string :location_name
      t.string :city
      t.string :country
      t.integer :aqi
      t.datetime :measured_at, null: false
      t.timestamps
    end

    add_index :air_quality_readings, :pollutant
    add_index :air_quality_readings, :measured_at
    add_index :air_quality_readings, [:latitude, :longitude]
    add_index :air_quality_readings, :aqi
  end
end
