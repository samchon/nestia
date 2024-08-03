# Benchmark of `nestia`
> - CPU: AMD Ryzen 9 7940HS w/ Radeon 780M Graphics
> - Memory: 31,954 MB
> - OS: win32
> - NodeJS version: v20.10.0
> - nestia version: v3.10.0-dev.20240803-2


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 52 | 82 | 6.60 | 7.31 
 object (hierarchical) | 125 | 164 | 11 | 11 
 object (recursive) | 133 | 154 | 10 | 10 
 object (union, explicit) | 81 | 101 | 12 | 12 
 array (simple) | 109 | 143 | 24 | 26 
 array (hierarchical) | 111 | 148 | 22 | 23 
 array (recursive) | 119 | 141 | 8.63 | 8.56 
 array (union, explicit) | 151 | 157 | 31 | 31 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 60 | 102 | 15 | 17 
 object (hierarchical) | 160 | 195 | 29 | 30 
 object (recursive) | 172 | 209 | 27 | 27 
 object (union, explicit) | 135 | 151 | 13 | 12 
 array (simple) | 147 | 170 | 27 | 26 
 array (hierarchical) | 174 | 171 | 23 | 23 
 array (recursive) | 135 | 144 | 23 | 23 
 array (union, explicit) | 144 | 156 | 29 | 30 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 70 | 96 | 12 | 13 
 object (hierarchical) | 152 | 175 | 20 | 21 
 object (recursive) | 158 | 174 | 19 | 20 
 object (union, explicit) | 103 | 114 | 12 | 13 
 array (simple) | 139 | 158 | 26 | 27 
 array (hierarchical) | 152 | 158 | 20 | 22 
 array (recursive) | 138 | 141 | 16 | 16 
 array (union, explicit) | 154 | 154 | 30 | 31 

> Unit: Megabytes/sec







Total elapsed time: 1,783,259 ms
