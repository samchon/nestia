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
 object (simple) | 56 | 81 | 85 | 6.65 | 7.35 
 object (hierarchical) | 127 | 167 | 162 | 11 | 12 
 object (recursive) | 132 | 155 | 155 | 10 | 11 
 object (union, explicit) | 81 | 103 | 69 | 12 | 12 
 array (simple) | 126 | 150 | 145 | 23 | 26 
 array (hierarchical) | 126 | 112 | 106 | 19 | 22 
 array (recursive) | 116 | 137 | 133 | 8.40 | 8.67 
 array (union, explicit) | 144 | 154 | 106 | 29 | 29 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 59 | 98 | 96 | 14 | 16 
 object (hierarchical) | 160 | 194 | 196 | 28 | 29 
 object (recursive) | 164 | 200 | 185 | 26 | 26 
 object (union, explicit) | 133 | 150 | 92 | 11 | 12 
 array (simple) | 140 | 154 | 159 | 25 | 25 
 array (hierarchical) | 168 | 171 | 126 | 22 | 23 
 array (recursive) | 128 | 142 | 87 | 23 | 23 
 array (union, explicit) | 139 | 145 | 38 | 19 | 29 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 68 | 94 | 92 | 12 | 13 
 object (hierarchical) | 148 | 171 | 170 | 20 | 21 
 object (recursive) | 158 | 167 | 165 | 19 | 19 
 object (union, explicit) | 101 | 111 | 72 | 11 | 12 
 array (simple) | 136 | 145 | 139 | 25 | 26 
 array (hierarchical) | 149 | 147 | 132 | 17 | 21 
 array (recursive) | 135 | 138 | 131 | 16 | 16 
 array (union, explicit) | 149 | 149 | 57 | 30 | 31 

> Unit: Megabytes/sec







Total elapsed time: 2,181,046 ms
