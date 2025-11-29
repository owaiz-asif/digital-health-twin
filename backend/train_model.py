import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import re
import os

# =====================================================
# STEP 1: TRAIN THE MODEL (Run this once)
# =====================================================

def train_model():
    """Train model from symptoms and vitals CSV files"""
    
    # Load data
    symptoms_df = pd.read_csv("dbackend/igital-health-twin/symptoms.csv")
    vitals_df = pd.read_csv("backend/digital-health-twin/vitals.csv")
    
    # Get unique diseases
    diseases = symptoms_df['disease'].unique()
    
    # Create training dataset
    training_data = []
    
    for disease in diseases:
        # Get symptoms for this disease
        disease_symptoms = symptoms_df[symptoms_df['disease'] == disease]['symptom'].tolist()
        
        # Get vitals for this disease
        disease_vitals = vitals_df[vitals_df['disease'] == disease].iloc[0]
        
        # Create multiple training samples with variations
        for _ in range(50):  # 50 samples per disease
            sample = {}
            
            # Parse vitals
            sample['fasting_blood_sugar'] = parse_vital_range(disease_vitals['fasting_blood_sugar'])
            sample['random_blood_sugar'] = parse_vital_range(disease_vitals['random_blood_sugar'])
            sample['hba1c'] = parse_vital_range(disease_vitals['hba1c'])
            sample['systolic_bp'] = parse_vital_range(disease_vitals['systolic_bp'])
            sample['diastolic_bp'] = parse_vital_range(disease_vitals['diastolic_bp'])
            
            # Add symptom features (randomly select 2-5 symptoms)
            num_symptoms = np.random.randint(2, min(6, len(disease_symptoms) + 1))
            selected_symptoms = np.random.choice(disease_symptoms, num_symptoms, replace=False)
            
            # Create binary features for common symptoms
            all_symptoms = [
                'fever', 'cough', 'headache', 'fatigue', 'chest_pain', 
                'shortness_of_breath', 'dizziness', 'nosebleeds', 'sore_throat',
                'runny_nose', 'sneezing', 'muscle_aches', 'increased_thirst',
                'frequent_urination', 'blurred_vision', 'weight_loss', 
                'numbness', 'tingling', 'weakness', 'hunger'
            ]
            
            for symptom in all_symptoms:
                sample[symptom] = 0
                # Check if any selected symptom contains this keyword
                for s in selected_symptoms:
                    if symptom.replace('_', ' ').lower() in s.lower():
                        sample[symptom] = 1
                        break
            
            sample['disease'] = disease
            training_data.append(sample)
    
    # Create DataFrame
    df = pd.DataFrame(training_data)
    
    # Separate features and target
    feature_cols = [col for col in df.columns if col != 'disease']
    X = df[feature_cols]
    y = df['disease']
    
    # Scale numeric features
    numeric_cols = ['fasting_blood_sugar', 'random_blood_sugar', 'hba1c', 'systolic_bp', 'diastolic_bp']
    scaler = StandardScaler()
    X[numeric_cols] = scaler.fit_transform(X[numeric_cols])
    
    # Train model
    model = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=10)
    model.fit(X, y)
    
    # Save model and metadata
    joblib.dump(model, "disease_model.joblib")
    joblib.dump(scaler, "scaler.joblib")
    joblib.dump(feature_cols, "feature_cols.joblib")
    
    print("✅ Model trained and saved successfully!")
    return model, scaler, feature_cols


def parse_vital_range(value):
    """Parse vital signs from text and return numeric value with variation"""
    value_str = str(value).lower()
    
    if 'normal' in value_str or 'n/a' in value_str:
        return np.random.uniform(90, 110)  # Normal range
    
    # Extract numbers
    numbers = re.findall(r'\d+\.?\d*', value_str)
    if numbers:
        base = float(numbers[0])
        # Add some variation
        variation = np.random.uniform(-5, 5)
        return base + variation
    
    return 100.0  # Default


# =====================================================
# STEP 2: PREDICTION SYSTEM
# =====================================================

def extract_vitals_from_text(text, vitals_df):
    """Extract vital signs from free text input"""
    vitals = {}
    text_lower = text.lower()
    
    # Define patterns for each vital
    patterns = {
        'fasting_blood_sugar': [r'fasting[_\s]*blood[_\s]*sugar[:\s]*(\d+)', r'fbs[:\s]*(\d+)'],
        'random_blood_sugar': [r'random[_\s]*blood[_\s]*sugar[:\s]*(\d+)', r'rbs[:\s]*(\d+)', r'blood[_\s]*sugar[:\s]*(\d+)'],
        'hba1c': [r'hba1c[:\s]*(\d+\.?\d*)', r'a1c[:\s]*(\d+\.?\d*)'],
        'systolic_bp': [r'systolic[_\s]*bp[:\s]*(\d+)', r'bp[:\s]*(\d+)[/\s]', r'blood[_\s]*pressure[:\s]*(\d+)'],
        'diastolic_bp': [r'diastolic[_\s]*bp[:\s]*(\d+)', r'bp[:\s]*\d+[/\s]*(\d+)']
    }
    
    for vital, pattern_list in patterns.items():
        for pattern in pattern_list:
            match = re.search(pattern, text_lower)
            if match:
                vitals[vital] = float(match.group(1))
                break
    
    # Fill missing vitals with mean from training data
    for col in ['fasting_blood_sugar', 'random_blood_sugar', 'hba1c', 'systolic_bp', 'diastolic_bp']:
        if col not in vitals:
            # Use normal range midpoint as default
            defaults = {
                'fasting_blood_sugar': 100,
                'random_blood_sugar': 120,
                'hba1c': 5.5,
                'systolic_bp': 120,
                'diastolic_bp': 80
            }
            vitals[col] = defaults[col]
    
    return vitals


def extract_symptoms_from_text(text):
    """Extract symptoms from free text input"""
    symptoms = {}
    text_lower = text.lower()
    
    # Define symptom keywords
    symptom_keywords = {
        'fever': ['fever', 'high temperature', 'pyrexia'],
        'cough': ['cough', 'coughing'],
        'headache': ['headache', 'head pain', 'migraine'],
        'fatigue': ['fatigue', 'tired', 'weakness', 'exhausted'],
        'chest_pain': ['chest pain', 'chest discomfort'],
        'shortness_of_breath': ['shortness of breath', 'breathless', 'difficulty breathing', 'dyspnea'],
        'dizziness': ['dizziness', 'dizzy', 'lightheaded'],
        'nosebleeds': ['nosebleed', 'nose bleed', 'bleeding nose'],
        'sore_throat': ['sore throat', 'throat pain'],
        'runny_nose': ['runny nose', 'nasal discharge'],
        'sneezing': ['sneeze', 'sneezing'],
        'muscle_aches': ['muscle ache', 'body ache', 'muscle pain'],
        'increased_thirst': ['thirst', 'thirsty', 'increased thirst'],
        'frequent_urination': ['frequent urination', 'urinating often', 'pee often'],
        'blurred_vision': ['blurred vision', 'blurry vision', 'vision problem'],
        'weight_loss': ['weight loss', 'losing weight'],
        'numbness': ['numbness', 'numb'],
        'tingling': ['tingling', 'pins and needles'],
        'weakness': ['weakness', 'weak'],
        'hunger': ['hunger', 'hungry', 'increased appetite']
    }
    
    for symptom, keywords in symptom_keywords.items():
        symptoms[symptom] = 0
        for keyword in keywords:
            if keyword in text_lower:
                symptoms[symptom] = 1
                break
    
    return symptoms


def predict_disease(vitals_text, symptoms_text):
    """Main prediction function"""
    
    # Load model and metadata
    if not os.path.exists("disease_model.joblib"):
        print("❌ Model not found. Training model first...")
        train_model()
    
    model = joblib.load("disease_model.joblib")
    scaler = joblib.load("scaler.joblib")
    feature_cols = joblib.load("feature_cols.joblib")
    
    # Load vitals reference
    vitals_df = pd.read_csv("vitals.csv")
    
    # Extract data from input
    vitals = extract_vitals_from_text(vitals_text, vitals_df)
    symptoms = extract_symptoms_from_text(symptoms_text)
    
    # Combine into feature vector
    user_data = {**vitals, **symptoms}
    
    # Create DataFrame with correct column order
    user_df = pd.DataFrame([user_data], columns=feature_cols)
    
    # Scale numeric features
    numeric_cols = ['fasting_blood_sugar', 'random_blood_sugar', 'hba1c', 'systolic_bp', 'diastolic_bp']
    user_df[numeric_cols] = scaler.transform(user_df[numeric_cols])
    
    # Get prediction probabilities
    probabilities = model.predict_proba(user_df)[0]
    classes = model.classes_
    
    # Get top 3 predictions
    top_indices = np.argsort(probabilities)[::-1][:3]
    
    results = []
    for idx in top_indices:
        if probabilities[idx] > 0.05:  # Only show if >5% probability
            results.append({
                'disease': classes[idx],
                'probability': probabilities[idx] * 100
            })
    
    return results, vitals, symptoms


# =====================================================
# STEP 3: MAIN PROGRAM
# =====================================================

def main():
    print("=" * 60)
    print("           🏥 DISEASE PREDICTION SYSTEM")
    print("=" * 60)
    print()
    
    # Check if model exists, if not train it
    if not os.path.exists("disease_model.joblib"):
        print("⚙️  First time setup: Training model...")
        train_model()
        print()
    
    # Get user input
    print("📋 Enter your VITALS (or press Enter to skip):")
    print("   Example: fasting blood sugar: 140, systolic bp: 150, diastolic bp: 95")
    vitals_input = input("\n   Vitals: ").strip()
    
    print()
    print("🩺 Enter your SYMPTOMS (or press Enter to skip):")
    print("   Example: I have fever, headache, and feeling very tired")
    symptoms_input = input("\n   Symptoms: ").strip()
    
    # Make prediction
    print()
    print("🔍 Analyzing your data...")
    print()
    
    results, vitals, symptoms = predict_disease(vitals_input, symptoms_input)
    
    # Display results
    print("=" * 60)
    print("📊 EXTRACTED DATA:")
    print("=" * 60)
    print(f"   Vitals: {vitals}")
    active_symptoms = [k for k, v in symptoms.items() if v == 1]
    print(f"   Symptoms detected: {', '.join(active_symptoms) if active_symptoms else 'None'}")
    print()
    
    print("=" * 60)
    print("🧠 PREDICTION RESULTS:")
    print("=" * 60)
    
    if results:
        for i, result in enumerate(results, 1):
            print(f"   {i}. {result['disease']:<20} → {result['probability']:.1f}% probability")
    else:
        print("   Unable to make a confident prediction with the given data.")
    
    print("=" * 60)
    print()
    print("⚠️  DISCLAIMER: This is for educational purposes only.")
    print("   Please consult a healthcare professional for proper diagnosis.")
    print()


if __name__ == "__main__":
    main()