# ---------------------------------------------
# TEXT-BASED INPUT DISEASE PREDICTION SYSTEM
# ---------------------------------------------

import re
import numpy as np
import pandas as pd
import joblib

# Load model + encoder
model = joblib.load("model.joblib")
le = joblib.load("label_encoder.joblib")

# Columns used
numeric_cols = [
    "age","blood_sugar","cholesterol","thyroid_tsh","wbc","rbc",
    "platelets","systolic_bp","diastolic_bp"
]

symptom_cols = [
    "cough","fever","headache","chest_pain","vomiting",
    "dizziness","fatigue","shortness_of_breath","sore_throat","runny_nose"
]

print("\n------------------------------------------------")
print("        🔍 TEXT BASED DISEASE PREDICTION")
print("------------------------------------------------\n")

# ---------------------------------------------------------
# 1) GET VITALS FROM PARAGRAPH
# ---------------------------------------------------------
print("Enter your VITALS in a paragraph (or keep blank):")
print("Example: age: 45, blood_sugar: 110, cholesterol: 200\n")

vitals_text = input("Vitals: ").lower()

user_vitals = {}

for col in numeric_cols:
    pattern = rf"{col}\s*[:=]\s*([0-9.]+)"
    match = re.search(pattern, vitals_text)
    if match:
        user_vitals[col] = float(match.group(1))
    else:
        user_vitals[col] = np.nan     # Missing values allowed


# ---------------------------------------------------------
# 2) GET SYMPTOMS FROM PARAGRAPH
# ---------------------------------------------------------
print("\nEnter your SYMPTOMS in a paragraph:")
print("Example: I have fever, cough and headache.\n")

symptoms_text = input("Symptoms: ").lower()

user_symptoms = {}

for col in symptom_cols:
    # If the symptom word appears anywhere → mark 1
    if col.replace("_", " ") in symptoms_text:
        user_symptoms[col] = 1
    elif col in symptoms_text:
        user_symptoms[col] = 1
    else:
        user_symptoms[col] = 0


# ---------------------------------------------------------
# 3) MERGE INTO A SINGLE ROW FOR PREDICTION
# ---------------------------------------------------------
user_data = {**user_vitals, **user_symptoms}
user_df = pd.DataFrame([user_data])

# ---------------------------------------------------------
# 4) PREDICT DISEASE
# ---------------------------------------------------------
pred_encoded = model.predict(user_df)[0]
predicted = le.inverse_transform([pred_encoded])[0]

print("\n------------------------------------------------")
print(f" 🧠 PREDICTION RESULT: You may have ➜ {predicted}")
print("------------------------------------------------\n")