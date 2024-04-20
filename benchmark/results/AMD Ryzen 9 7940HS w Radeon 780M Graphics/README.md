# Benchmark of `nestia`
> - CPU: AMD Ryzen 9 7940HS w/ Radeon 780M Graphics
> - Memory: 31,954 MB
> - OS: win32
> - NodeJS version: v20.10.0
> - nestia version: v3.0.5


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 54 | 84 | 6.56 | 7.45 
 object (hierarchical) | 133 | 168 | 11 | 11 
 object (recursive) | 136 | 162 | 11 | 10 
 object (union, explicit) | 82 | 106 | 12 | 12 
 array (simple) | 128 | 159 | 25 | 28 
 array (hierarchical) | 95 | 109 | 13 | 22 
 array (recursive) | 113 | 140 | 8.56 | 8.57 
 array (union, explicit) | 144 | 157 | 19 | 30 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 60 | 102 | 15 | 16 
 object (hierarchical) | 162 | 198 | 28 | 29 
 object (recursive) | 170 | 209 | 27 | 27 
 object (union, explicit) | 130 | 149 | 12 | 12 
 array (simple) | 150 | 156 | 26 | 28 
 array (hierarchical) | 167 | 120 | 22 | 23 
 array (recursive) | 131 | 136 | 22 | 22 
 array (union, explicit) | 140 | 140 | 29 | 30 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 71 | 96 | 10 | 13 
 object (hierarchical) | 151 | 175 | 20 | 21 
 object (recursive) | 155 | 176 | 19 | 19 
 object (union, explicit) | 101 | 112 | 12 | 12 
 array (simple) | 136 | 143 | 25 | 26 
 array (hierarchical) | 106 | 134 | 20 | 22 
 array (recursive) | 133 | 130 | 16 | 16 
 array (union, explicit) | 143 | 145 | 31 | 31 

> Unit: Megabytes/sec







Total elapsed time: 1,753,592 ms
