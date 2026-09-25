from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
import time
import sys
from typing import List, Dict, Any

router = APIRouter(
    prefix="/api/ml/tools",
    tags=["ML Tools"]
)

class BenchmarkResponse(BaseModel):
    num_elements: int
    list_time_ms: float
    numpy_time_ms: float
    speedup: float
    list_memory_kb: float
    numpy_memory_kb: float

@router.get("/benchmark", response_model=BenchmarkResponse)
def run_benchmark(n: int = 100000):
    n = max(1000, min(n, 1000000))
    
    # Python List Speed Test
    py_list = list(range(n))
    start_py = time.perf_counter()
    _ = [x ** 2 for x in py_list]
    end_py = time.perf_counter()
    list_time_ms = (end_py - start_py) * 1000
    
    # NumPy Speed Test
    np_arr = np.arange(n)
    start_np = time.perf_counter()
    _ = np_arr ** 2
    end_np = time.perf_counter()
    numpy_time_ms = (end_np - start_np) * 1000
    
    speedup = list_time_ms / max(0.0001, numpy_time_ms)
    
    # Rough memory estimation
    list_memory_kb = (sys.getsizeof(py_list) + sum(sys.getsizeof(x) for x in py_list[:100]) * (n / 100)) / 1024
    numpy_memory_kb = np_arr.nbytes / 1024
    
    return BenchmarkResponse(
        num_elements=n,
        list_time_ms=round(list_time_ms, 3),
        numpy_time_ms=round(numpy_time_ms, 3),
        speedup=round(speedup, 1),
        list_memory_kb=round(list_memory_kb, 1),
        numpy_memory_kb=round(numpy_memory_kb, 1)
    )

@router.get("/nba-data")
def get_nba_sample_data():
    sample_data = [
        {"Name": "Avery Bradley", "Team": "Boston Celtics", "Number": 0, "Position": "PG", "Age": 25, "Salary": 7730337},
        {"Name": "Jae Crowder", "Team": "Boston Celtics", "Number": 99, "Position": "SF", "Age": 25, "Salary": 6796117},
        {"Name": "John Holland", "Team": "Boston Celtics", "Number": 30, "Position": "SG", "Age": 27, "Salary": None},
        {"Name": "R.J. Hunter", "Team": "Boston Celtics", "Number": 28, "Position": "SG", "Age": 22, "Salary": 1148640},
        {"Name": "Jonas Jerebko", "Team": "Boston Celtics", "Number": 8, "Position": "PF", "Age": 29, "Salary": 5000000},
        {"Name": "Amir Johnson", "Team": "Boston Celtics", "Number": 90, "Position": "PF", "Age": 29, "Salary": 12000000},
        {"Name": "Jordan Mickey", "Team": "Boston Celtics", "Number": 55, "Position": "PF", "Age": 21, "Salary": 1170960},
        {"Name": "Kelly Olynyk", "Team": "Boston Celtics", "Number": 41, "Position": "C", "Age": 25, "Salary": 2165160},
        {"Name": "Terry Rozier", "Team": "Boston Celtics", "Number": 12, "Position": "PG", "Age": 22, "Salary": 1824360},
        {"Name": "Marcus Smart", "Team": "Boston Celtics", "Number": 36, "Position": "PG", "Age": 22, "Salary": 3431040},
        {"Name": "Gordon Hayward", "Team": "Utah Jazz", "Number": 20, "Position": "SF", "Age": 26, "Salary": 15409728},
        {"Name": "Rudy Gobert", "Team": "Utah Jazz", "Number": 27, "Position": "C", "Age": 24, "Salary": 1175880},
        {"Name": "Derrick Favors", "Team": "Utah Jazz", "Number": 15, "Position": "PF", "Age": 24, "Salary": 12000000},
        {"Name": "Trey Lyles", "Team": "Utah Jazz", "Number": 41, "Position": "PF", "Age": 20, "Salary": 2346540},
        {"Name": "Shelvin Mack", "Team": "Utah Jazz", "Number": 8, "Position": "PG", "Age": 26, "Salary": 2433333}
    ]
    return {"data": sample_data}
