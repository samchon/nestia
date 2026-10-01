import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("implicit")
export class ImplicitController {
  @core.TypedRoute.Get("number")
  public async number() {
    return 1;
  }

  @core.TypedRoute.Get("object1")
  public async object1() {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }

  @core.TypedRoute.Get("object2")
  public async object2() {
    return {
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
    };
  }

  @core.TypedRoute.Get("objectConstant")
  public async objectConstant() {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    } as const;
  }

  @core.TypedRoute.Get("array")
  public async array() {
    return [
      {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
        resource: process.resourceUsage(),
      },
    ];
  }

  @core.TypedRoute.Get("arrayUnion")
  public async arrayUnion() {
    return [
      {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
        resource: process.resourceUsage(),
      },
      {
        arch: process.arch,
        platform: process.platform,
        versions: process.versions,
      },
    ];
  }

  @core.TypedRoute.Get("matrix")
  public async matrix() {
    return [
      [
        {
          cpu: process.cpuUsage(),
          memory: process.memoryUsage(),
          resource: process.resourceUsage(),
        },
      ],
    ];
  }

  @core.TypedRoute.Get("matrixUnion")
  public async matrixUnion() {
    return [
      [
        {
          cpu: process.cpuUsage(),
          memory: process.memoryUsage(),
          resource: process.resourceUsage(),
        },
        {
          arch: process.arch,
          platform: process.platform,
          versions: process.versions,
        },
      ],
    ];
  }

  @core.TypedRoute.Get("tuple")
  public async tuple() {
    return [
      {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
        resource: process.resourceUsage(),
      },
      {
        arch: process.arch,
        platform: process.platform,
        versions: process.versions,
      },
    ] as const;
  }
}
