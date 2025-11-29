# medical_disease_prediction.py
# -------------------------------------------------------
# TRAIN + PREDICT DISEASE FROM VITALS + SYMPTOMS (ONE FILE)
# -------------------------------------------------------

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# -------------------------------------------------------
# 1) LOAD DATASET (CSV must have correct columns)
# -------------------------------------------------------

DATA_FILE = r"C:\Users\Jhanavi R R\OneDrive\Desktop\disease predictor\medical_dataset.csv"
 # <-- Your dataset here

if not os.path.exists(DATA_FILE):
    print("\n❌ ERROR: medical_dataset.csv NOT FOUND.")
    print("Create a CSV with columns (example):")
    print("age, blood_sugar, cholesterol, thyroid_tsh, wbc, rbc, platelets, systolic_bp, diastolic_bp, cough, fever, headache, chest_pain, vomiting, dizziness, fatigue, shortness_of_breath, sore_throat, runny_nose, disease\n")
    exit()

df = pd.read_csv(DATA_FILE)

# Columns
numeric_cols = [
    "age","blood_sugar","cholesterol","thyroid_tsh","wbc","rbc",
    "platelets","systolic_bp","diastolic_bp"
]

symptom_cols = [
    "cough","fever","headache","chest_pain","vomiting",
    "dizziness","fatigue","shortness_of_breath","sore_throat","runny_nose"
]

required = numeric_cols + symptom_cols + ["disease"]

for col in required:
    if col not in df.columns:
        print(f"❌ Missing column in CSV: {col}")
        exit()

# clean types
df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors='coerce')
df[symptom_cols] = df[symptom_cols].fillna(0).astype(int)
df.dropna(inplace=True)

X = df[numeric_cols + symptom_cols]
y = df["disease"].astype(str)

# -------------------------------------------------------
# 2) LABEL ENCODER
# -------------------------------------------------------
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# -------------------------------------------------------
# 3) TRAIN / TEST SPLIT
# -------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# -------------------------------------------------------
# 4) PREPROCESSING + MODEL PIPELINE
# -------------------------------------------------------
preprocess = ColumnTransformer([
    ("scale", StandardScaler(), numeric_cols)  # symptoms are 0/1 already
], remainder="passthrough")

model = Pipeline([
    ("pre", preprocess),
    ("clf", RandomForestClassifier(n_estimators=200, random_state=42))
])

# -------------------------------------------------------
# 5) TRAIN MODEL
# -------------------------------------------------------
print("\n⏳ Training model...")
model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"\n✅ Model trained successfully! Accuracy = {acc:.3f}")
print("\nClassification Report:\n")
print(classification_report(y_test, preds, target_names=le.classes_))

# Save model
joblib.dump(model, "model.joblib")
joblib.dump(le, "label_encoder.joblib")
print("\n💾 Model saved as model.joblib")
print("💾 Label encoder saved as label_encoder.joblib")

# -------------------------------------------------------
# 6) USER INPUT PREDICTION
# -------------------------------------------------------
def get_num(prompt):
    while True:
        try:
            return float(input(prompt))
        except:
            print("Enter a number.")

def get_sym(prompt):
    while True:
        x = input(prompt + " (0 = No, 1 = Yes): ")
        if x in ["0","1"]:
            return int(x)
        print("Enter 0 or 1 only.")

print("\n------------------------------")
print("🔍 DISEASE PREDICTION SYSTEM")
print("------------------------------\n")

print("Enter your VITALS:")

user = {}
for col in numeric_cols:
    user[col] = get_num(f"{col}: ")

print("\nEnter your SYMPTOMS:")
for col in symptom_cols:
    user[col] = get_sym(f"{col}")

# Convert to DF
user_df = pd.DataFrame([user])

# Prediction
loaded_model = joblib.load("model.joblib")
loaded_le = joblib.load("label_encoder.joblib")

pred_encoded = loaded_model.predict(user_df)[0]
predicted_disease = loaded_le.inverse_transform([pred_encoded])[0]

print("\n----------------------------------------")
print(f"🧠 PREDICTION RESULT: You may have ➜ {predicted_disease}")
print("----------------------------------------\n")