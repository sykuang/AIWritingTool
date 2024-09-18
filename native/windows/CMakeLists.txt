cmake_minimum_required(VERSION 3.28)
project(copy)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)



add_executable("copy"  ${CMAKE_CURRENT_SOURCE_DIR}/copy.cpp)
