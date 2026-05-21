import numpy as np
import pandas as pd
import streamlit as st


st.set_page_config(page_title="PulseFit", page_icon="PF", layout="wide")

st.title("PulseFit Python Practice")
st.caption("A Streamlit-friendly version of the list, NumPy, pandas, and password examples.")

st.header("List Comprehensions")

num = [i for i in range(1, 101)]
st.subheader("Numbers from 1 to 100")
st.write(num)

list_a = [1, 2, 3, 3, 4, 5, 67, 8]
even_list = [num for num in list_a if num % 2 == 0]
odd_list = [num for num in list_a if num % 2 != 0]

col1, col2 = st.columns(2)
with col1:
    st.subheader("Even numbers")
    st.write(even_list)
with col2:
    st.subheader("Odd numbers")
    st.write(odd_list)

st.header("Range Calculator")
start = st.number_input("Enter the starting of range", value=1, step=1)
end = st.number_input("Enter the ending of range", value=10, step=1)
start = int(start)
end = int(end)

if start <= end:
    square_list = [n**2 for n in range(start, end + 1)]
    square_cube_list = [n**2 if n % 2 == 0 else n**3 for n in range(start, end + 1)]

    st.subheader("Squares")
    st.write(square_list)

    st.subheader("Even squares and odd cubes")
    st.write(square_cube_list)
else:
    st.warning("Starting range must be less than or equal to ending range.")

st.header("NumPy Examples")
arr = np.array([10, 20, 30])
st.write("Array + 5", arr + 5)

matrix = np.array([[1, 2], [3, 4]])
st.write("Matrix", matrix)
st.write("Mean", np.mean(matrix))

reshaped = np.arange(6).reshape(2, 3)
st.write("Reshaped array", reshaped)

std_arr = np.array([10, 20, 30, 40])
st.write("Standard deviation", np.std(std_arr))

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
st.write("Transpose of A", np.transpose(A))
st.write("Matrix multiplication A @ B", A @ B)

st.header("Password Strength Checker")
password = st.text_input("Enter your password", type="password")
if password:
    strong = len(password) >= 8 and any(char.isdigit() for char in password) and any(ch.isupper() for ch in password)
    if strong:
        st.success("Strong")
    else:
        st.error("Weak")

st.header("Pandas DataFrame")
pf = pd.DataFrame({"values": [11, 22, 33]})
st.dataframe(pf, use_container_width=True)
