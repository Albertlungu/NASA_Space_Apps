from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import traceback # <-- Used for detailed error logging
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
MODEL_PATH = 'health_model/HealthPredict.sav'
SCALER_PATH = 'health_model/HealthScaler.sav' 

# --- Load the trained model ---
try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print(f"✓ Model loaded successfully from {MODEL_PATH}")
except FileNotFoundError:
    print(f"ERROR: Model file not found at {MODEL_PATH}")
    print("Please ensure HealthPredict.sav is in the backend directory")
    model = None
except Exception as e:
    print(f"ERROR loading model: {e}")
    model = None

# --- Load the scaler ---
try:
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)
    print(f"✓ Scaler loaded successfully from {SCALER_PATH}")
except FileNotFoundError:
    print(f"ERROR: Scaler file not found at {SCALER_PATH}")
    print("Please ensure HealthScaler.sav is in the backend directory")
    scaler = None
except Exception as e:
    print(f"ERROR loading scaler: {e}")
    scaler = None


# Feature names expected by the API (12 total).
# The first 10 features listed here are the ones the model expects for prediction.
FEATURE_NAMES = [
    'AQI', 'PM10', 'PM2_5', 'NO2', 'SO2', 'O3',
    'Temperature', 'Humidity', 'WindSpeed',
    'HospitalAdmissions'
]
# The model specifically expects only the first 10 features for prediction.
NUM_MODEL_FEATURES = 10 

# Features that can be defaulted to 0.0 if not provided by the client
DEFAULTABLE_HEALTH_FEATURES = [
    'RespiratoryCases', 
    'CardiovascularCases'
]

# Health impact class labels
CLASS_LABELS = {
    0: 'Very High',
    1: 'High',
    2: 'Moderate',
    3: 'Low',
    4: 'Very Low'
}

# Recommendations for each health impact class
RECOMMENDATIONS = {
    0: [  # Very High
        'Immediate medical evaluation recommended',
        'Evacuate to areas with clean air if possible',
        'Use N95/KN95 masks at all times outdoors',
        'Monitor vital signs closely',
        'Prepare emergency medical supplies',
        'Follow emergency evacuation procedures'
    ],
    1: [  # High
        'Seek medical advice for vulnerable individuals',
        'Avoid all outdoor activities',
        'Use air purifiers indoors',
        'Wear N95 masks for any outdoor exposure',
        'Monitor symptoms daily',
        'Keep emergency contacts readily available'
    ],
    2: [  # Moderate
        'Limit outdoor activities to essential only',
        'Vulnerable groups should stay indoors',
        'Consider wearing masks outdoors',
        'Use air purifiers if available',
        'Monitor air quality updates regularly',
        'Keep windows closed during peak pollution hours'
    ],
    3: [  # Low
        'Sensitive groups should consider limiting prolonged outdoor exertion',
        'Monitor air quality if you have respiratory conditions',
        'Normal activities for general population',
        'Good ventilation recommended',
        'Stay hydrated and maintain healthy practices'
    ],
    4: [  # Very Low
        'Air quality is good for all outdoor activities',
        'Excellent time for exercise and recreation',
        'No restrictions necessary',
        'Maintain routine health practices',
        'Enjoy outdoor activities freely'
    ]
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None, # <-- NEW
        'message': 'Backend is running'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint
    Expects JSON with all 12 features. Defaults health metrics if missing.
    """
    if model is None or scaler is None: # <-- Check both model and scaler
        # This returns 500 but should be caught during startup
        return jsonify({
            'error': 'Model or Scaler not loaded',
            'message': f"Prediction cannot run. Model loaded: {model is not None}, Scaler loaded: {scaler is not None}"
        }), 500
    
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # --- DEBUG LOGGING ---
        print("\n--- INCOMING PREDICTION DATA ---")
        print(data)
        print("--------------------------------")
        
        if not data:
            error_msg = {'error': 'No JSON data provided, check Content-Type header'}
            print(f"!!! 400 ERROR: {error_msg}") # Log 400 error
            return jsonify(error_msg), 400
        
        # --- Inject default values for missing health features ---
        for feature in DEFAULTABLE_HEALTH_FEATURES:
            if feature not in data:
                data[feature] = 0.0 # Set a default numeric value
                print(f"DEBUG: Defaulted missing feature '{feature}' to 0.0")
        
        # Validate all 12 required features are present
        missing_features = [f for f in FEATURE_NAMES if f not in data]
        if missing_features:
            error_msg = {
                'error': 'Missing required features',
                'missing': missing_features
            }
            print(f"!!! 400 ERROR: Missing features: {missing_features}") # Log 400 error
            return jsonify(error_msg), 400
        
        # Extract all 12 features into the 'features' list in the correct order
        features = []
        for feature_name in FEATURE_NAMES:
            try:
                # Ensure values are converted to float
                value = float(data[feature_name])
                features.append(value)
            except (ValueError, TypeError):
                error_msg = {
                    'error': f'Invalid value for {feature_name}',
                    'message': f'Feature {feature_name} must be numeric. Received: {data[feature_name]}'
                }
                print(f"!!! 400 ERROR: Invalid numeric value for {feature_name}: {data[feature_name]}") # Log 400 error
                return jsonify(error_msg), 400
        
        # Select only the first 10 features (AQI...HospitalAdmissions) for the model input
        features_for_model = features[:NUM_MODEL_FEATURES] 
        
        # Convert to numpy array and reshape for prediction
        features_array = np.array(features_for_model).reshape(1, -1)
        
        # --- NEW: Apply feature scaling ---
        scaled_features_array = scaler.transform(features_array)
        
        # Make prediction (now using SCALED features)
        prediction = model.predict(scaled_features_array)[0]
        
        # Get prediction probabilities if available (using SCALED features)
        try:
            probabilities = model.predict_proba(scaled_features_array)[0]
            confidence = float(max(probabilities) * 100)
        except AttributeError:
            # Model doesn't support predict_proba (e.g., specific SVR models)
            confidence = 85.0
        
        # Calculate health impact score (0-100 scale)
        # We use the new indices matching the reordered FEATURE_NAMES list
        aqi = features[0]
        pm25 = features[2]
        admissions = features[9]        
        
        # Get class label and recommendations
        class_label = CLASS_LABELS.get(int(prediction), 'Unknown')
        recommendations = RECOMMENDATIONS.get(int(prediction), [])
        
        # Prepare response
        response = {
            'success': True,
            'health_impact_class': int(prediction),
            'class_label': class_label,
            'confidence': round(confidence, 1),
            'recommendations': recommendations,
            'input_features': {name: features[i] for i, name in enumerate(FEATURE_NAMES)}
        }
        
        return jsonify(response)
    
    except Exception as e:
        # Print the full stack trace to the console for debugging
        print("\n" + "="*80)
        print("!!! UNHANDLED INTERNAL SERVER ERROR (500) TRACEBACK !!!")
        traceback.print_exc()
        print("="*80 + "\n")
        
        # Return a generic 500 error to the client
        return jsonify({
            'error': 'Prediction failed unexpectedly',
            'message': 'An unhandled exception occurred on the server side. Check server logs.'
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    if model is None or scaler is None:
        return jsonify({
            'error': 'Model or Scaler not loaded'
        }), 500
    
    return jsonify({
        'model_type': str(type(model).__name__),
        'features': FEATURE_NAMES,
        'num_features': len(FEATURE_NAMES),
        'classes': CLASS_LABELS,
        'model_loaded': True,
        'scaler_loaded': True
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("AQI Health Impact Prediction Backend")
    print("="*60)
    print(f"Model Status: {'✓ Loaded' if model else '✗ Not Loaded'}")
    print(f"Scaler Status: {'✓ Loaded' if scaler else '✗ Not Loaded'}")
    print(f"Expected Features ({len(FEATURE_NAMES)}): {', '.join(FEATURE_NAMES)}")
    print(f"Server starting on http://localhost:5000")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
