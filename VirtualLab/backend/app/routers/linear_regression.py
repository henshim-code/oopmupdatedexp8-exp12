from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np
from typing import List, Optional

router = APIRouter(
    prefix="/api/ml/linear-regression",
    tags=["Linear Regression"]
)

class SimulationRequest(BaseModel):
    preset: Optional[str] = "custom"
    n_samples: int = Field(default=50, ge=10, le=500)
    slope: float = Field(default=3.0, ge=-20.0, le=20.0)
    intercept: float = Field(default=5.0, ge=-50.0, le=50.0)
    noise: float = Field(default=2.5, ge=0.0, le=30.0)
    x_min: float = Field(default=0.0, ge=-100.0, le=50.0)
    x_max: float = Field(default=10.0, ge=1.0, le=200.0)
    train_split: float = Field(default=0.8, ge=0.5, le=0.95)
    solver: str = Field(default="ols")  # "ols" or "gradient_descent"
    learning_rate: float = Field(default=0.01, ge=0.0001, le=0.5)
    epochs: int = Field(default=100, ge=10, le=1000)
    predict_x: Optional[float] = None

class PointData(BaseModel):
    x: float
    y_true: float
    y_actual: float
    y_pred: float
    is_train: bool

class MetricsData(BaseModel):
    r2_score: float
    mse: float
    rmse: float
    mae: float
    fitted_slope: float
    fitted_intercept: float

class ConvergencePoint(BaseModel):
    epoch: int
    cost: float

class SimulationResponse(BaseModel):
    points: List[PointData]
    metrics: MetricsData
    cost_history: List[ConvergencePoint]
    prediction_result: Optional[dict] = None

@router.post("/simulate", response_model=SimulationResponse)
def simulate_linear_regression(req: SimulationRequest):
    try:
        np.random.seed(42) # Reproducible sample generation
        
        # Ensure x_min < x_max
        x_min = min(req.x_min, req.x_max - 1.0)
        x_max = max(req.x_max, req.x_min + 1.0)
        
        X = np.random.uniform(x_min, x_max, req.n_samples)
        X.sort()
        
        # True linear relation: y = slope * X + intercept
        y_true = req.slope * X + req.intercept
        noise_vec = np.random.normal(0, req.noise, req.n_samples)
        y_actual = y_true + noise_vec
        
        # Train / Test split
        n_train = int(req.n_samples * req.train_split)
        train_indices = set(np.random.choice(req.n_samples, n_train, replace=False))
        
        X_train = X[list(train_indices)]
        y_train = y_actual[list(train_indices)]
        
        cost_history = []
        
        if req.solver == "gradient_descent":
            # Manual Gradient Descent Solver
            theta0, theta1 = 0.0, 0.0
            m_len = len(X_train)
            for epoch in range(1, req.epochs + 1):
                h = theta0 + theta1 * X_train
                d_theta0 = (1 / m_len) * np.sum(h - y_train)
                d_theta1 = (1 / m_len) * np.sum((h - y_train) * X_train)
                theta0 -= req.learning_rate * d_theta0
                theta1 -= req.learning_rate * d_theta1
                
                if epoch == 1 or epoch % (max(1, req.epochs // 20)) == 0 or epoch == req.epochs:
                    current_cost = float((1 / (2 * m_len)) * np.sum((h - y_train) ** 2))
                    cost_history.append(ConvergencePoint(epoch=epoch, cost=round(current_cost, 4)))
            
            fitted_intercept = float(theta0)
            fitted_slope = float(theta1)
        else:
            # OLS Closed form solution
            X_mean = np.mean(X_train)
            y_mean = np.mean(y_train)
            numerator = np.sum((X_train - X_mean) * (y_train - y_mean))
            denominator = np.sum((X_train - X_mean) ** 2)
            
            if denominator == 0:
                fitted_slope = 0.0
            else:
                fitted_slope = float(numerator / denominator)
            fitted_intercept = float(y_mean - fitted_slope * X_mean)

        # Predictions on all samples
        y_pred = fitted_slope * X + fitted_intercept
        
        # Metrics on full dataset
        mse = float(np.mean((y_actual - y_pred) ** 2))
        rmse = float(np.sqrt(mse))
        mae = float(np.mean(np.abs(y_actual - y_pred)))
        
        ss_res = np.sum((y_actual - y_pred) ** 2)
        ss_tot = np.sum((y_actual - np.mean(y_actual)) ** 2)
        r2 = float(1 - (ss_res / ss_tot)) if ss_tot != 0 else 1.0

        points = []
        for i in range(req.n_samples):
            points.append(
                PointData(
                    x=round(float(X[i]), 2),
                    y_true=round(float(y_true[i]), 2),
                    y_actual=round(float(y_actual[i]), 2),
                    y_pred=round(float(y_pred[i]), 2),
                    is_train=(i in train_indices)
                )
            )

        pred_res = None
        if req.predict_x is not None:
            pred_y = fitted_slope * req.predict_x + fitted_intercept
            pred_res = {
                "x_input": round(req.predict_x, 2),
                "y_predicted": round(float(pred_y), 2)
            }

        return SimulationResponse(
            points=points,
            metrics=MetricsData(
                r2_score=round(r2, 4),
                mse=round(mse, 4),
                rmse=round(rmse, 4),
                mae=round(mae, 4),
                fitted_slope=round(fitted_slope, 4),
                fitted_intercept=round(fitted_intercept, 4)
            ),
            cost_history=cost_history,
            prediction_result=pred_res
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
