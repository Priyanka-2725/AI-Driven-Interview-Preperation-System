import json
import os
import random
import subprocess
import sys
from typing import List, Dict, Any, Optional

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "questions_seed.json")

def load_seed_questions() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def run_reference_solution(solution_code: str, test_input: str) -> Optional[str]:
    """Runs the vetted reference solution on test_input via isolated python -I subprocess to compute expected output."""
    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-c", solution_code],
            input=test_input,
            text=True,
            capture_output=True,
            timeout=2.0
        )
        if proc.returncode == 0:
            return proc.stdout.strip()
    except Exception:
        pass
    return None

def generate_parameterized_variation(base_question: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a parameterized variation of a coding question with reference-verified test cases."""
    if base_question.get("type") != "coding" or "referenceSolution" not in base_question:
        return dict(base_question)
    
    question = dict(base_question)
    ref_code = question["referenceSolution"]
    slug = question.get("slug")
    
    extra_test_cases = []
    if slug == "two-sum":
        # Generate random array and target
        for i in range(2):
            n = random.randint(4, 8)
            nums = random.sample(range(1, 50), n)
            idx1, idx2 = sorted(random.sample(range(n), 2))
            target = nums[idx1] + nums[idx2]
            inp = f"{' '.join(map(str, nums))}\n{target}"
            expected = run_reference_solution(ref_code, inp)
            if expected is not None:
                extra_test_cases.append({
                    "input": inp,
                    "expectedOutput": expected,
                    "isHidden": True
                })
    elif slug == "binary-search":
        for i in range(2):
            n = random.randint(5, 10)
            nums = sorted(random.sample(range(1, 100), n))
            target = random.choice(nums) if i == 0 else random.randint(101, 150)
            inp = f"{' '.join(map(str, nums))}\n{target}"
            expected = run_reference_solution(ref_code, inp)
            if expected is not None:
                extra_test_cases.append({
                    "input": inp,
                    "expectedOutput": expected,
                    "isHidden": True
                })

    if extra_test_cases:
        # Append generated hidden test cases
        question["testCases"] = list(question["testCases"]) + extra_test_cases

    return question

def get_questions(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    type: Optional[str] = None,
    count: int = 1,
    generate_variations: bool = False
) -> List[Dict[str, Any]]:
    seeds = load_seed_questions()
    filtered = seeds
    
    if topic:
        filtered = [q for q in filtered if q.get("topic", "").lower() == topic.lower()]
    if difficulty:
        filtered = [q for q in filtered if q.get("difficulty", "").lower() == difficulty.lower()]
    if type:
        filtered = [q for q in filtered if q.get("type", "").lower() == type.lower()]
        
    if not filtered:
        # Fallback to general pool if exact topic match is empty
        filtered = seeds
        if type:
            filtered = [q for q in filtered if q.get("type", "").lower() == type.lower()]
            
    if not filtered:
        return []
        
    # Sample questions up to count
    selected = random.sample(filtered, min(count, len(filtered)))
    
    results = []
    for q in selected:
        if generate_variations:
            results.append(generate_parameterized_variation(q))
        else:
            results.append(dict(q))
            
    return results
