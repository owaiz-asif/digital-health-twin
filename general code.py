import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer

# -----------------------------
# 1. LOAD DATASET
# -----------------------------
dataset_path = r"C:\Users\Jhanavi R R\OneDrive\Desktop\disease predictor\medical_dataset.csv"
df = pd.read_csv(dataset_path)

print("\n✅ Dataset Loaded Successfully")
print(df.head())

# -----------------------------
# 2. TARGET COLUMN (LAST COLUMN ASSUMED)
# -----------------------------
target_column = df.columns[-1]
X = df.drop(target_column, axis=1)
y = df[target_column]

print("\n✅ Target Column:", target_column)

# -----------------------------
# 3. HANDLE MISSING VALUES
# -----------------------------
numeric_cols = X.select_dtypes(include=['int64', 'float64']).columns
categorical_cols = X.select_dtypes(include=['object']).columns

# Impute numeric columns with mean
num_imputer = SimpleImputer(strategy='mean')
X[numeric_cols] = num_imputer.fit_transform(X[numeric_cols])

# Impute categorical columns with most frequent
cat_imputer = SimpleImputer(strategy='most_frequent')
X[categorical_cols] = cat_imputer.fit_transform(X[categorical_cols])

# Encode categorical features
cat_encoders = {}
for col in categorical_cols:
    le_col = LabelEncoder()
    X[col] = le_col.fit_transform(X[col])
    cat_encoders[col] = le_col  # save each encoder in case needed later

# -----------------------------
# 4. ENCODE TARGET LABELS
# -----------------------------
le_target = LabelEncoder()
y_encoded = le_target.fit_transform(y)

# -----------------------------
# 5. TRAIN TEST SPLIT
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42
)

# -----------------------------
# 6. MODEL TRAINING
# -----------------------------
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# -----------------------------
# 7. SAVE MODEL & ENCODERS
# -----------------------------
joblib.dump(model, "model.joblib")
joblib.dump(le_target, "label_encoder_target.joblib")
joblib.dump(cat_encoders, "label_encoders_features.joblib")

print("\n🎉 TRAINING COMPLETE!")
print("✅ model.joblib saved")
print("✅ label_encoder_target.joblib saved")
print("✅ label_encoders_features.joblib saved")
