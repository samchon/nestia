# Benchmark of `nestia`
> - CPU: AMD Ryzen 9 7940HS w/ Radeon 780M Graphics
> - Memory: 31,954 MB
> - OS: win32
> - NodeJS version: v20.10.0
> - nestia version: v3.0.2


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 53 | 84 | 85 | 6.58 | 5.51 
 object (hierarchical) | 130 | 171 | 166 | 11 | 12 
 object (recursive) | 133 | 163 | 160 | 10 | 9.68 
 object (union, explicit) | 72 | 100 | 70 | 11 | 12 
 array (simple) | 121 | 149 | 152 | 24 | 26 
 array (hierarchical) | 92 | 151 | 112 | 18 | 22 
 array (recursive) | 119 | 139 | 134 | 8.32 | 8.23 
 array (union, explicit) | 140 | 150 | 108 | 29 | 30 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 57 | 103 | 91 | 14 | 17 
 object (hierarchical) | 157 | 197 | 197 | 29 | 29 
 object (recursive) | 160 | 189 | 174 | 26 | 27 
 object (union, explicit) | 115 | 150 | 90 | 12 | 12 
 array (simple) | 126 | 137 | 144 | 25 | 25 
 array (hierarchical) | 139 | 165 | 78 | 23 | 22 
 array (recursive) | 123 | 138 | 88 | 22 | 23 
 array (union, explicit) | 135 | 136 | 38 | 29 | 29 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 69 | 91 | 92 | 12 | 12 
 object (hierarchical) | 138 | 170 | 167 | 19 | 21 
 object (recursive) | 149 | 166 | 173 | 19 | 18 
 object (union, explicit) | 89 | 105 | 68 | 11 | 12 
 array (simple) | 128 | 131 | 136 | 23 | 25 
 array (hierarchical) | 114 | 145 | 87 | 20 | 22 
 array (recursive) | 129 | 135 | 120 | 15 | 15 
 array (union, explicit) | 138 | 133 | 50 | 27 | 28 

> Unit: Megabytes/sec







Total elapsed time: 2,175,215 ms
